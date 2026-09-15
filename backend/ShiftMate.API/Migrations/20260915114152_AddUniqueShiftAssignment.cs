using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftMate.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueShiftAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ShiftAssignments_EmployeeId",
                table: "ShiftAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_EmployeeId_ShiftId",
                table: "ShiftAssignments",
                columns: new[] { "EmployeeId", "ShiftId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ShiftAssignments_EmployeeId_ShiftId",
                table: "ShiftAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_EmployeeId",
                table: "ShiftAssignments",
                column: "EmployeeId");
        }
    }
}
